import http from 'http';
import crypto from 'crypto';
import { exec } from 'child_process';

const SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';
 
const GITHUB_REPOSITORIES_TO_DIR = {
  'dontfrankout/xm_budget': {appDir: '/home/ec2-user/xm_budget', branchToWatch: 'staging', appName: "xm_budget"},
  'dontfrankout/xm_react_template': {appDir: '/home/ec2-user/xm_react_template', branchToWatch: 'main', appName: "xm_demo"},

};

const requestListener = function (req, res) {
  req.on('data', chunk => {
    console.log("Processing Request")

    const signature = `sha1=${crypto.createHmac('sha1', SECRET).update(chunk).digest('hex')}`;
    const isAllowed = req.headers['x-hub-signature'] === signature;

    if(!isAllowed) {
      res.writeHead(401);
      let thisResponse = JSON.stringify({error: `Unauthorized`})
      res.end(thisResponse)
      return
    }

    const body = JSON.parse(chunk);
    const hookBranch = body.ref

    const directory = GITHUB_REPOSITORIES_TO_DIR[body.repository.full_name];
   
    if(!directory) {
      res.writeHead(404);
      let thisResponse = JSON.stringify({error: `This repo is not found on this build agent.`})
      res.end(thisResponse)
      return
    }

    const isBranch = hookBranch === `refs/heads/${directory.branchToWatch}`;

    if(!isBranch) {
      res.writeHead(400);
      let thisResponse = JSON.stringify({error: `build server is watching branch ${directory.branchToWatch}, ignoring ${hookBranch}`})
      res.end(thisResponse)
      console.log()
      return
    }
  

    if (isAllowed && isBranch && directory) {
      try {
        console.log("Running Build Commands")
        
        exec(`cd ${directory.appDir} && git pull && touch ~/${directory.appName}_A_Pull && npm run-script build && touch ~/${directory.appName}_B_Build && npm run-script deploy && touch ~/${directory.appName}_C_deploy`);

        res.writeHead(200);
        res.end("OK?");

      } catch (error) {
        console.log(error);

        res.writeHead(500);
        res.end("Server Error");
      }

    } else {

      res.writeHead(500);
      res.end("Other Unhandled Error");

    }
  });
}
 
http
  .createServer(requestListener)
  .listen(8080);

  