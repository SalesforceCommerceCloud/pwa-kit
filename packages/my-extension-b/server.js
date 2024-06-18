export default ({ app, options }) => {
  app.get("/my-extension-b", (req, res) => {
    res.send("Hello from my extension B!");
  });
};
