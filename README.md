# btc-cent-forecast-01

Entry for [make.fun btc-cent-forecast-01](https://make.fun/bounty/btc-cent-forecast-01)
by [@dio955](https://make.fun/u/dio955): forecast Bitcoin's US-dollar price
4 hours ahead from the last 72 hours of 1-minute closes, 12 times over 48 hours.
Scored on mean absolute error in cents; a prize needs beating the house's
persistence baseline (guess = the checkpoint's own close).

## Method

`main.ts` (Node 22, standard library only, offline, deterministic) is a
volatility-conditioned mean reversion:

- Default to **persistence**: forecast the checkpoint's last price unchanged.
- Only when the price sits more than **1 four-hour sigma** away from its
  **4-hour moving average** does it count as a signal; then pull the forecast
  **30% of the way back** toward that mean.

Backtest on the six practice cases (528 rolling 4h-ahead forecasts): MAE
43,173c vs persistence 43,822c (+1.47%). On the five exact practice
checkpoints whose answers are recoverable, it never triggers and exactly ties
persistence. Momentum was tested and rejected — extrapolating the last-4h
return worsens the MAE at every strength.

## Run

```sh
mkdir -p out && MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node main.ts
```

Reads every `<id>.in` in the input directory and writes `<id>.out` as
`{"forecasts":[{"case":"<id>","price":<number>}]}` — exactly one row, price
finite, > 0, < 10,000,000, on the 5-decimal grid.

## License

MIT — see [LICENSE](LICENSE).
