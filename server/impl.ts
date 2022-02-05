import mode from "ml-array-mode";
import { Response } from "../api/base";
import {
  LobbyPhase,
  QuestionsPhase,
  GamePhase,
  PlayerState,
  UserId,
  IJoinGameRequest,
  IStartGameRequest,
  IVoteRequest,
  Nickname,
} from "../api/types";
import { wordList } from "./words";
import { Methods, Context } from "./.hathora/methods";

type InternalState = {
  players: UserId[];
  nicknames: Nickname[];
  word?: string;
  spy?: Nickname;
  votes: Map<Nickname, Nickname>;
};

export class Impl implements Methods<InternalState> {
  initialize(userId: UserId, ctx: Context): InternalState {
    return {
      players: [],
      nicknames: [],
      votes: new Map(),
    };
  }
  joinGame(state: InternalState, userId: UserId, ctx: Context, request: IJoinGameRequest): Response {
    if (state.players.includes(userId)) {
      return Response.error("You have already joined");
    }
    if (state.word !== undefined) {
      return Response.error("Game has already started");
    }
    if (state.nicknames.includes(request.nickname)) {
      return Response.error("Nickname is already being used");
    }
    state.players.push(userId);
    state.nicknames.push(request.nickname);
    return Response.ok();
  }
  startGame(state: InternalState, userId: UserId, ctx: Context, request: IStartGameRequest): Response {
    if (state.word !== undefined) {
      return Response.error("Game has already started");
    }
    state.word = ctx.chance.pickone(wordList);
    state.spy = ctx.chance.pickone(state.nicknames);
    return Response.ok();
  }
  vote(state: InternalState, userId: UserId, ctx: Context, request: IVoteRequest): Response {
    if (state.word === undefined) {
      return Response.error("Game not started yet");
    }
    if (state.votes.size === state.nicknames.length) {
      return Response.error("Voting phase is over");
    }

    state.votes.set(getNickname(state, userId), request.user);
    return Response.ok();
  }
  getUserState(state: InternalState, userId: UserId): PlayerState {
    const nickname = getNickname(state, userId);
    return {
      players: state.nicknames,
      word: nickname === state.spy ? undefined : state.word,
      phase: getPhase(state),
      myVote: state.votes.get(nickname),
    };
  }
}

function getNickname(state: InternalState, userId: UserId) {
  const idx = state.players.findIndex((player) => player === userId);
  return state.nicknames[idx];
}

function getPhase(state: InternalState): GamePhase {
  if (state.word === undefined) {
    return { type: "LobbyPhase", val: LobbyPhase.default() };
  } else if (state.votes.size < state.nicknames.length) {
    return { type: "QuestionsPhase", val: QuestionsPhase.default() };
  } else {
    //@ts-ignore
    const votedSpy: Nickname = mode(Array.from(state.votes.values()));
    return { type: "RevealPhase", val: { votedSpy, revealedSpy: state.spy! } };
  }
}
