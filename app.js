//MAIN
(async () => {
  console.log("==========PROGRAM START==========");
      console.log("SETTING EXIT CODE 1");
      process.exitCode = 1;
      console.log("::set-output name=exitCode::5");
  console.log("==========PROGRAM END==========");
  // process.exit(0);
})();
