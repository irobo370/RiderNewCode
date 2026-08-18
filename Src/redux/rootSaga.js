import {all} from "redux-saga/effects";
import {watchAuthSaga} from "./saga/authSaga";

export default function* rootSaga() {
  yield all([
    watchAuthSaga(),
  ]);
}