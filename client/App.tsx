import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Col, Container, Navbar, Row } from "react-bootstrap";
import { MainGame, PlayerList } from "./Game";
import { getUserDisplayName } from "./.hathora/base";
import { HathoraClient, HathoraConnection } from "./.hathora/client";
import { PlayerState } from "./.hathora/types";

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
  const user = HathoraClient.getUserFromToken(token);
  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand>Spyfall</Navbar.Brand>
        </Container>
      </Navbar>
      <Container style={{ marginTop: 50 }}>
        <Row>
          <Col style={{ textAlign: "center" }}>
            <MainGame state={playerState} client={connection} />
          </Col>
          <Col style={{ textAlign: "center" }}>
            <PlayerList players={playerState.players} myVote={playerState.myVote} connection={connection} />
          </Col>
        </Row>
      </Container>
    </>
  );
}
