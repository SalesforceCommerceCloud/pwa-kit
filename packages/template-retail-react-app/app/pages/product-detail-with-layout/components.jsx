import React, {Fragement, useEffect, useRef, useState} from 'react'
import * as ReactDOM from 'react-dom';

const canUseDOM = () => {
  return !!(typeof window !== 'undefined' && window.document && window.document.createElement);
}

export const Portal = ({ rootId, children }) => {
    if (!canUseDOM()) {
      return null;
    }
    
    const target = useRef(null);
    const [current, setCurrent] = useState(document.createElement("div"))

    useEffect(() => {
      let container = document.getElementById(rootId);
      // if (!container) {
      //   container = document.createElement("div");
      //   container.setAttribute("id", rootId);
      //   document.body.appendChild(container);
      // }
  
      if (container) {
        container.appendChild(current);
      }
  
      return () => {
        current.remove();
        if (container.childNodes.length === 0) {
          container.remove();
        }
      };
    }, [rootId]);
  

    // if (!target.current) {

      useEffect(() => {
        setInterval(() => {
          if (document.getElementById(rootId)){
            setCurrent(document.getElementById(rootId))
          }            
        }, 250)
      }, [])
    // }
  
    console.log('target container: ', current)
    return ReactDOM.createPortal(children, current);
  };