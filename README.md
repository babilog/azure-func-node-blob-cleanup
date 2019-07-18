# nodejs-azure-blob-cleanup

Tool to delete Azure File Storage files that are older than X days. Ideally, this should run as a scheduled webjob on an Azure web app or as a scheduled Azure Function.

## Dependencies
- node >= 8
- npm >=  5.5.1

## How to run on local

1. Rename the ```app.tpl.config``` to ```app.config```
2. Add necessary credentials such as ```accountName```, ```accountKey```, ```fileShare```
3. Ensure that ```debug``` property is set to ```true``` before running, otherwise it will  **delete** the files from your File Storage Share.
4. Run the following commands:

```shell
 npm i
 node main.js
```