import http from 'http';
import crypto from 'crypto';
import {config} from './config.js';
//import { exec } from 'child_process';
 
const SECRET = 'MY_GITHUB_WEBHOOK_SECRET';
 
const GITHUB_REPOSITORIES_TO_DIR = {
  'dontfrankout/xm_budget': '/home/ec2-user/xm_budget',
};
 
http
  .createServer((req, res) => {
    req.on('data', chunk => {
      console.log("in on data")
      const signature = `sha1=${crypto
        .createHmac('sha1', SECRET)
        .update(chunk)
        .digest('hex')}`;
 
      const isAllowed = req.headers['x-hub-signature'] === signature;
 
      const body = JSON.parse(chunk);
 
      //const isMaster = body.ref === 'refs/heads/master';
      
      const directory = GITHUB_REPOSITORIES_TO_DIR[body.repository.full_name];
 
      if (isAllowed && directory) {
        try {
          console.log("do something already")
          //exec(`cd ${directory} && bash deploy.sh`);
        } catch (error) {
          console.log(error);
        }
      }
    });
 
    res.end("hello?");
  })
  .listen(8080);