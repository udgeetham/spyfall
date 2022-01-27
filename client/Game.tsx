import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { lookupUser, getUserDisplayName } from "./.hathora/base";
import { HathoraConnection } from "./.hathora/client";
import { PlayerState, UserId } from "./.hathora/types";

export function MainGame({ state, client }: { state: PlayerState; client: HathoraConnection }) {
  if (state.phase.type === "LobbyPhase") {
    return (
      <>
        <h1>Waiting for players to join...</h1>
        <Button variant="primary" onClick={() => client.startGame({})}>
          Start Game
        </Button>
      </>
    );
  } else if (state.phase.type === "QuestionsPhase") {
    return <h1>{state.word === undefined ? "You are the spy" : state.word}</h1>;
  } else {
    return (
      <>
        <h1>Voted spy</h1>
        <h4>
          <Player userId={state.phase.val.votedSpy} />
        </h4>
        <hr />
        <h1>Actual spy</h1>
        <h4>
          <Player userId={state.phase.val.revealedSpy} />
        </h4>
      </>
    );
  }
}

export function PlayerList({
  players,
  myVote,
  connection,
}: {
  players: UserId[];
  myVote: UserId | undefined;
  connection: HathoraConnection;
}) {
  return (
    <>
      <h4>Players</h4>
      {players.map((player) => (
        <div key={player}>
          <Button
            variant="outline-secondary"
            active={myVote === player}
            onClick={() => connection.vote({ user: player })}
          >
            <Player userId={player} />
          </Button>
        </div>
      ))}
    </>
  );
}

function Player({ userId }: { userId: UserId }) {
  const [name, setName] = useState<string>("");
  useEffect(() => {
    lookupUser(userId).then((userData) => setName(getUserDisplayName(userData)));
  }, [userId]);
  return <>{name}</>;
}
