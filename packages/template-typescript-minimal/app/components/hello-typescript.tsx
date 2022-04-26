import React from "react";

interface Props {
    message: string
}

const HelloTS = ({ message }: Props) => {
  return (
    <span>And this is a TS component (it takes a prop: "{message}").</span>
  );
}

export default HelloTS;
