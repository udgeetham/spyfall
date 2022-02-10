import mode from "ml-array-mode";
import BiMap from "bidirectional-map";
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
  IPlayAgainRequest,
} from "../api/types";
import { wordList } from "./words";
import { Methods, Context } from "./.hathora/methods";

type InternalState = {
  players: BiMap<UserId>;
  nicknames: Nickname[];
  word?: string;
  spy?: Nickname;
  votes: Map<Nickname, Nickname>;
};

export class Impl implements Methods<InternalState> {
  initialize(userId: UserId, ctx: Context): InternalState {
    return {
      players: new BiMap(),
      nicknames: [],
      votes: new Map(),
    };
  }
  joinGame(state: InternalState, userId: UserId, ctx: Context, request: IJoinGameRequest): Response {
    if (state.players.has(userId)) {
      return Response.error("You have already joined");
    }
    if (state.word !== undefined) {
      return Response.error("Game has already started");
    }
    if (state.players.hasValue(request.nickname)) {
      return Response.error("Nickname is already being used");
    }
    state.players.set(userId, request.nickname);
    state.nicknames.push(request.nickname);
    return Response.ok();
  }
  startGame(state: InternalState, userId: UserId, ctx: Context, request: IStartGameRequest): Response {
    if (state.word !== undefined) {
      return Response.error("Game has already started");
    }
    setupNewGame(state, ctx);
    return Response.ok();
  }
  vote(state: InternalState, userId: UserId, ctx: Context, request: IVoteRequest): Response {
    if (state.word === undefined) {
      return Response.error("Game not started yet");
    }
    if (state.votes.size === state.players.size) {
      return Response.error("Voting phase is over");
    }

    state.votes.set(state.players.get(userId), request.user);
    return Response.ok();
  }
  playAgain(state: InternalState, userId: string, ctx: Context, request: IPlayAgainRequest): Response {
    if (state.votes.size !== state.players.size) {
      return Response.error("Can not start a new game when a game is already in progress");
    }
    setupNewGame(state, ctx);
    return Response.ok();
  }
  getUserState(state: InternalState, userId: UserId): PlayerState {
    const nickname = state.players.get(userId);
    return {
      players: state.nicknames,
      word: nickname === state.spy ? undefined : state.word,
      phase: getPhase(state),
      myVote: state.votes.get(nickname),
    };
  }
}

function setupNewGame(state: InternalState, ctx: Context) {
  state.word = ctx.chance.pickone(wordList);
  state.nicknames = ctx.chance.shuffle(Array.from(state.players.values()));
  state.spy = ctx.chance.pickone(state.nicknames);
  state.votes = new Map();
}

function getPhase(state: InternalState): GamePhase {
  if (state.word === undefined) {
    return { type: "LobbyPhase", val: LobbyPhase.default() };
  } else if (state.votes.size < state.players.size) {
    return { type: "QuestionsPhase", val: QuestionsPhase.default() };
  } else {
    //@ts-ignore
    const votedSpy: Nickname = mode(Array.from(state.votes.values()));
    return { type: "RevealPhase", val: { votedSpy, revealedSpy: state.spy! } };
  }
}
