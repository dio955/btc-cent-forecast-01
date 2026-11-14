# BTC cent forecast — volatility-conditioned mean reversion

Entry for [btc-cent-forecast-01](https://make.fun/bounty/btc-cent-forecast-01)
by [dio955](https://make.fun/u/dio955).

## Method

Forecast Bitcoin's US-dollar price 240 minutes (4 hours) after each
checkpoint, from the 72 hours of 1-minute closes up to it. The program stays
at persistence (the checkpoint close) unless the price has moved more than
one 4-hour standard deviation away from its 4-hour moving average; then it
pulls the forecast 30% of the way back toward that mean. At a 4-hour horizon
Bitcoin mostly reverts toward its recent mean, but only a large move is a
real signal — small wiggles are noise, and extrapolating them loses.

## Backtest

Rolling backtest over 528 four-hour-ahead forecasts: MAE 43,173 cents vs
persistence 43,822 cents (+1.47% better). On the five exact practice
checkpoints whose answers are recoverable, the trigger never fires and the
model exactly ties persistence. Momentum was tested and rejected:
extrapolating the last-4h return worsens MAE at every strength.

## Run

```sh
mkdir -p /tmp/btc-out
MAKEFUN_INPUT_DIR=<input dir> MAKEFUN_OUTPUT_DIR=/tmp/btc-out node main.ts
```

Reads every `*.in` file in the input directory (sorted) and writes one
`<id>.out` per case: a single line of JSON,
`{"forecasts":[{"case":"<id>","price":<number>}]}`.

Node 22, standard library only, offline, deterministic.

## License

MIT
