import React from "react";

interface Props {
    message: number
}

const HelloTS = ({ message }: Props) => {
  return (
    <div>
        <h1>This is a hello from TS</h1>
        <p>Message: "{message}"</p>
    </div>
  );
};

export default HelloTS;
