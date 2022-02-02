import React, { useState } from "react";
import { Button, FormControl, InputGroup } from "react-bootstrap";
import { HathoraConnection } from "./.hathora/client";
import { Nickname, PlayerState } from "./.hathora/types";

export function MainGame({ state, client }: { state: PlayerState; client: HathoraConnection }) {
  const [nickname, setNickname] = useState<string>("");
  if (state.phase.type === "LobbyPhase") {
    return (
      <>
        <h1>Waiting for players to join...</h1>
        <div>
          <InputGroup className="mb-3">
            <FormControl placeholder="Enter nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            <Button variant="primary" onClick={() => client.joinGame({ nickname })}>
              Join Game
            </Button>
          </InputGroup>
        </div>
        <div>
          <Button variant="primary" onClick={() => client.startGame({})}>
            Start Game
          </Button>
        </div>
      </>
    );
  } else if (state.phase.type === "QuestionsPhase") {
    return <h1>{state.word === undefined ? "You are the spy" : state.word}</h1>;
  } else {
    return (
      <>
        <h1>Voted spy</h1>
        <h4>{state.phase.val.votedSpy}</h4>
        <hr />
        <h1>Actual spy</h1>
        <h4>{state.phase.val.revealedSpy}</h4>
      </>
    );
  }
}

export function PlayerList({
  players,
  myVote,
  connection,
}: {
  players: Nickname[];
  myVote: Nickname | undefined;
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
            {player}
          </Button>
        </div>
      ))}
    </>
  );
}
