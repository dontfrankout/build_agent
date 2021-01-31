import http from 'http';
import crypto from 'crypto';
import { exec } from 'child_process';

const SECRET = process.env.GITHUB_WEBHOOK_SECRET;
 
const GITHUB_REPOSITORIES_TO_DIR = {
  'dontfrankout/xm_budget': {appDir: '/home/ec2-user/xm_budget', branchToWatch: 'staging', appName: "xm_budget"},
};

const requestListener = function (req, res) {
  req.on('data', chunk => {
    console.log("Processing Request")
    const signature = `sha1=${crypto
      .createHmac('sha1', SECRET)
      .update(chunk)
      .digest('hex')}`;

    const isAllowed = req.headers['x-hub-signature'] === signature;

    if(!isAllowed) {
      res.writeHead(401);
      return
    }

    const body = JSON.parse(chunk);

    const hookBranch = body.ref
    const isBranch = hookBranch === `refs/heads/${directory.branchToWatch}`;

    if(!isBranch) {
      res.writeHead(400);
      return
    }

    const directory = GITHUB_REPOSITORIES_TO_DIR[body.repository.full_name];

    if(!directory) {
      res.writeHead(404);
      return
    }
  

    if (isAllowed && isBranch && directory) {
      try {
        console.log("Running Build Commands")
        
        exec(`cd ${directory.appDir} && git pull && touch ~/pullsucess.yay && npm run-script build && touch ~/build.yay && npm run-script deploy && touch ~/deploy.yay`);

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

  