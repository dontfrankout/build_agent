import http from 'http';
import crypto from 'crypto';
import {config} from './config.js';
import { exec } from 'child_process';
 
const SECRET = 'MY_GITHUB_WEBHOOK_SECRET';
 
const GITHUB_REPOSITORIES_TO_DIR = {
  'dontfrankout/xm_budget': {appDir: '/home/ec2-user/xm_budget', branchToWatch: 'staging'},
};

const requestListener = function (req, res) {
  req.on('data', chunk => {
    console.log("Processing Request")
    const signature = `sha1=${crypto
      .createHmac('sha1', SECRET)
      .update(chunk)
      .digest('hex')}`;

    const isAllowed = req.headers['x-hub-signature'] === signature;

    const body = JSON.parse(chunk);

    const directory = GITHUB_REPOSITORIES_TO_DIR[body.repository.full_name];

    const hookBranch = body.ref

    const isBranch = hookBranch === `refs/heads/${directory.branchToWatch}`;

    console.log("Body:")
    
    

    if (isAllowed && isBranch && directory) {
      try {

        console.log("Running Build Commands")
        
        exec(`cd ${directory.appDir} && touch deploy.yay && git pull && npm run build && npm run deploy`);
      } catch (error) {
        console.log(error);
      }
    } else {
      console.log("isAllowed", isAllowed, "isBranch", isBranch,"directory", directory)


    }
  });
  res.writeHead(200);
  res.end("hello?");
}
 
http
  .createServer(requestListener)
  .listen(8080);