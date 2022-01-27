import { Heap } from "heap-js";
import { wordList } from "./words";
import { Methods, Context } from "./.hathora/methods";
import { Response } from "./.hathora/base";
import {
  LobbyPhase,
  QuestionsPhase,
  GamePhase,
  PlayerState,
  UserId,
  ICreateGameRequest,
  IJoinGameRequest,
  IStartGameRequest,
  IVoteRequest,
} from "./.hathora/types";

type InternalState = {
  players: UserId[];
  word?: string;
  spy?: UserId;
  votes: Map<UserId, UserId>;
};

export class Impl implements Methods<InternalState> {
  createGame(userId: UserId, ctx: Context, request: ICreateGameRequest): InternalState {
    return {
      players: [userId],
      votes: new Map(),
    };
  }
  joinGame(state: InternalState, userId: UserId, ctx: Context, request: IJoinGameRequest): Response {
    state.players.push(userId);
    return Response.ok();
  }
  startGame(state: InternalState, userId: UserId, ctx: Context, request: IStartGameRequest): Response {
    state.word = wordList[ctx.randInt(wordList.length)];
    state.spy = state.players[ctx.randInt(state.players.length)];
    return Response.ok();
  }
  vote(state: InternalState, userId: UserId, ctx: Context, request: IVoteRequest): Response {
    state.votes.set(userId, request.user);
    return Response.ok();
  }
  getUserState(state: InternalState, userId: UserId): PlayerState {
    return {
      players: state.players,
      word: userId === state.spy ? undefined : state.word,
      phase: getPhase(state),
      myVote: state.votes.get(userId),
    };
  }
}

function getPhase(state: InternalState): GamePhase {
  if (state.word === undefined) {
    return { type: "LobbyPhase", val: LobbyPhase.default() };
  } else if (state.votes.size < state.players.length) {
    return { type: "QuestionsPhase", val: QuestionsPhase.default() };
  } else {
    return { type: "RevealPhase", val: { votedSpy: tallyVotes(state.votes), revealedSpy: state.spy! } };
  }
}

function tallyVotes(votes: Map<UserId, UserId>): UserId {
  // TODO: consider tie-breaking scenarios (favor spy?)
  const maxHeap = new Heap<UserId>(Heap.maxComparator);
  for (let value of votes.values()) {
    maxHeap.push(value);
  }
  return maxHeap.pop()!;
}
