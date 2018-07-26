#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;

var pendingBuild = false;


function runBuild() {
    if (pendingBuild) {
        console.log('Build pending, doing nothing')
    }

    console.log('Building...');
    let command = 'npm run build';

    pendingBuild = true;
    let testProcess = spawn(command, {stdio: 'inherit', shell: true});
    testProcess.on('exit', (exitCode, signal) => {
        pendingBuild = false;
    });
}


function watchSrcDir() {
    let dir = path.join(__dirname, '../src');
    console.log('Watching: ', dir, ' for any changes to *.js files');

    fs.watch(dir, { recursive: true}, function(eventType, filename){
        if (filename) {
            if (filename.endsWith('.js')) {
                console.log('Detected change in file: ', filename)
                runBuild();
            }
        }
    });
}


watchSrcDir();
