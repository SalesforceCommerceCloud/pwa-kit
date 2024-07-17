// import a library to ensure webpack builds it correctly
import cors from "cors";

export default ({ app, options }) => {
  app.use(cors());

  app.get("/b", (req, res) => {
    res.send("b");
  });
};
