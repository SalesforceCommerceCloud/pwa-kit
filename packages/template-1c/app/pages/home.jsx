import React, { useEffect, useState } from "react";
import fetch from "cross-fetch";

const Home = ({ dadJoke }) => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(counter + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [counter, setCounter]);

  return (
    <div>
      <h1>This is the home page!!</h1>
      <pre>{JSON.stringify(dadJoke, null, 4)}</pre>
      <hr />
    </div>
  );
};

Home.getTemplateName = () => "home";

Home.getProps = async (req, res) => {
  const resp = await fetch("https://icanhazdadjoke.com/", {
    headers: { Accept: "application/json" },
  });
  const data = await resp.json();
  return { dadJoke: data };
};

export default Home;
