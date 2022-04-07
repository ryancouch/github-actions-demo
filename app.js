//MAIN
(async () => {
  console.log("==========PROGRAM START==========");
      console.log("SETTING EXIT CODE 3");
      process.exitCode = 1;
      console.log("::set-output name=exitCode::3");
  console.log("==========PROGRAM END==========");
  process.exit(0);
})();
