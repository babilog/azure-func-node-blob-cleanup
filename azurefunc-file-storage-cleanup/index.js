/*
 * Created on: Fri Sep 22 2017
 * Author: GB
 * Description: NodeJS scheduled Azure function, removes files from file share after specified time
 */

const azure = require("azure-storage");
const fs = require("fs");
const R = require("ramda");

const fileShare = process.env["fileShare"];
const directory = process.env["directory"] || "";
const deleteOlderThan = process.env["deleteOlderThan"] || 14;
const debug = process.env["debug"];
const accountName = process.env["accountName"];
const accountKey = process.env["accountKey"];

module.exports = function(context, myTimer) {
  var timeStamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log("JavaScript is running late!");
  }

  const fileService = azure.createFileService(accountName, accountKey);

  /**
   * @ignore
   * @description Main execution flow
   * @return null
   */
  const main = () => {
    listAllFiles(fileService, fileShare, directory, null, null, function(
      err,
      res
    ) {
      if (err) {
        context.log(err);
      } else {
        R.forEach(deleteOldFiles, res.files);
      }
    });
  };

  const deleteOldFiles = file => {
    fileService.getFileProperties(
      fileShare,
      directory,
      file.name,
      null,
      function(err, res) {
        if (res != null)
          if (daysSinceToday(res.lastModified) > deleteOlderThan) {
            //delete file
            if (!debug) {
              fileService.deleteFile(
                fileShare,
                directory,
                res.name,
                null,
                function(err, result) {
                  context.log(`Deleted ${res.name}`);
                }
              );
            }
          }
      }
    );
  };

  /**
   * @ignore
   * @description Rescurive function iterates through the directory file share
   * and lists the file names for each file within the container
   */

  const listAllFiles = (
    fileService,
    share,
    directory,
    token,
    options,
    callback
  ) => {
    let items = {
      files: []
    };

    fileService.listFilesAndDirectoriesSegmented(
      share,
      directory,
      token,
      options,
      function(err, res) {
        if (res != null) items.files.push.apply(items.files, res.entries.files);

        var token = res.continuationToken;
        if (token) {
          listAllFiles(fileService, share, directory, token, options, callback);
        } else {
          context.log(
            "Completed, there are " +
              items.files.length +
              " files on the share dir"
          );
          callback(null, items);
        }
      }
    );
  };

  const toMilliseconds = dateString => Date.parse(dateString);

  const today = () => new Date();

  const toDays = x => x / oneDay();

  const roundDownToWhole = x => Math.floor(x);

  const oneDay = () => 1000 * 60 * 60 * 24;

  const differenceInDays = R.pipe(
    R.subtract,
    toDays,
    roundDownToWhole
  );

  const daysSinceToday = date =>
    differenceInDays(toMilliseconds(today()), toMilliseconds(date));

  //when not executing within a context, call main as entry point
  main();

  context.log("JavaScript timer trigger function ran!", timeStamp);

  context.done();
};
