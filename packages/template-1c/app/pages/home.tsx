import React, { useEffect, useState } from "react";
import fetch from "cross-fetch";

import HelloTS from "../components/hello-typescript";
import HelloJS from "../components/hello-javascript"

interface Props {
  dadJoke: string,
}

const Home = ({ dadJoke }: Props) => {
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
      <HelloTS message={counter} />
      <HelloJS message={counter} />
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
