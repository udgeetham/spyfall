import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { HathoraClient, HathoraConnection } from "./.hathora/client";
import { PlayerState } from "./.hathora/types";
import { PlayerStateComponent } from "./plugins/PlayerState";

const client = new HathoraClient(import.meta.env.VITE_APP_ID);

if (localStorage.getItem("token") !== null) {
  const token = localStorage.getItem("token")!;
  ReactDOM.render(<App token={token} />, document.getElementById("root"));
} else {
  client.loginAnonymous().then((token) => {
    localStorage.setItem("token", token);
    ReactDOM.render(<App token={token} />, document.getElementById("root"));
  });
}

function App({ token }: { token: string }) {
  const [url, setUrl] = useState<string>(window.location.pathname);
  const [connection, setConnection] = useState<HathoraConnection>();
  const [playerState, setPlayerState] = useState<PlayerState>();

  useEffect(() => {
    if (url === "/") {
      client
        .connectNew(token, {}, ({ state }) => setPlayerState(state), console.error)
        .then((connection) => {
          setConnection(connection);
          const newUrl = `/game/${connection.stateId}`;
          setUrl(newUrl);
          history.pushState({}, "", newUrl);
        });
    } else if (url.startsWith("/game/")) {
      if (connection === undefined) {
        const stateId = url.split("/game/")[1];
        const connection = client.connectExisting(token, stateId, ({ state }) => setPlayerState(state), console.error);
        setConnection(connection);
      }
    }
  }, [token]);

  if (connection === undefined || playerState === undefined) {
    return <div>Loading...</div>;
  }

  return <PlayerStateComponent val={playerState} user={HathoraClient.getUserFromToken(token)} client={connection} />;
}
