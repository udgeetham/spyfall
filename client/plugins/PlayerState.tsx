import React, { useEffect, useState } from "react";
import ReactDom from "react-dom";
//@ts-ignore
import reactToWebComponent from "react-to-webcomponent";
import { UserId, PlayerState, LobbyPhase } from "../.hathora/types";
import { HathoraConnection } from "../.hathora/client";
import { UserData, lookupUser, getUserDisplayName } from "../.hathora/base";

export function PlayerStateComponent({
  val,
  user,
  client,
}: {
  val: PlayerState;
  user: UserData;
  client: HathoraConnection;
}) {
  if (!val.players.includes(user.id)) {
    client.joinGame({});
  }
  if (val.phase.type === "LobbyPhase") {
    return (
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <PlayerList players={val.players} />
        </div>
        <div style={{ flex: 5, textAlign: "center", fontSize: 52 }}>
          <div>Waiting for players to join...</div>
          <button onClick={() => client.startGame({})}>Start Game</button>
        </div>
      </div>
    );
  } else if (val.phase.type === "QuestionsPhase") {
    return (
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <VotingList players={val.players} myVote={val.myVote} client={client} />
        </div>
        <div style={{ flex: 2, textAlign: "center", fontSize: 52 }}>
          {val.word === undefined ? <div>You are the spy</div> : <div>{val.word}</div>}
        </div>
      </div>
    );
  } else {
    return (
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <PlayerList players={val.players} />
        </div>
        <div style={{ flex: 2, textAlign: "center", fontSize: 52 }}>
          <div>
            Voted spy: <Player userId={val.phase.val.votedSpy} />
          </div>
          <div>
            Actual spy: <Player userId={val.phase.val.revealedSpy} />
          </div>
        </div>
      </div>
    );
  }
}

function PlayerList({ players }: { players: UserId[] }) {
  return (
    <>
      <div>Players:</div>
      {players.map((player) => (
        <div>
          <Player userId={player} />
        </div>
      ))}
    </>
  );
}

function VotingList({
  players,
  myVote,
  client,
}: {
  players: UserId[];
  myVote: UserId | undefined;
  client: HathoraConnection;
}) {
  return (
    <>
      <div>Players:</div>
      {players.map((player) => (
        <div>
          <Player userId={player} />
          <button onClick={() => client.vote({ user: player })}>{myVote === player ? "Voted" : "Vote"}</button>
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
  return <span>{name}</span>;
}

export default reactToWebComponent(PlayerStateComponent, React, ReactDom);
