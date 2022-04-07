//MAIN
(async () => {
  console.log("==========PROGRAM START==========\n");
      console.log("SETTING EXIT CODE 1");
      process.exitCode = 1;
      console.log("::set-output name=exitCode::1");

  console.log("==========PROGRAM END==========");
})();
