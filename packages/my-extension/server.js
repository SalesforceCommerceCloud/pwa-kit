import cors from "cors";
import bp from "body-parser";
import passport from "passport";

export default ({ app, options }) => {
  app.use(cors());

  app.get("/my-extension", (req, res) => {
    res.send("Hello from my extension!!");
  });
};
