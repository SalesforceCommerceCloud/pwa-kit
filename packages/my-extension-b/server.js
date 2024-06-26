export default ({ app, options }) => {
  app.get("/my-extension-b", (req, res) => {
    res.send("Hey this is another extension!");
  });
};
