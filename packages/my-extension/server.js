import cors from "cors";

export default ({ app, options }) => {
  app.use(cors());

  app.get("/my-extension", (req, res) => {
    res.send("Hello from my extension!!");
  });
};
