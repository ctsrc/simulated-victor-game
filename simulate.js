/*
 * Copyright (c) 2019 Erik Nordstrøm <erik@nordstroem.no>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

const results_summary_rounds_elem = document.getElementById('results-summary-rounds');
const n_rounds_simulated_elem = document.getElementById('n-rounds-simulated');

let num_wins_ad  = 0; // Apriori Decision (AD) as baseline 1
let num_wins_ct  = 0; // Coin Toss (CT) as baseline 2
let num_wins_osr = 0; // Optimal Stopping Rule (OSR) from The Secretary Problem
let num_wins_gn  = 0; // GistNoesis (GN) for The Victor Game

const win_pct_ad_elem  = document.getElementById('win-pct-ad');
const win_pct_ct_elem  = document.getElementById('win-pct-ct');
const win_pct_osr_elem = document.getElementById('win-pct-osr');
const win_pct_gn_elem  = document.getElementById('win-pct-gn');

const nth_str = (n) =>
{
  if (n < 10 || n >= 20)
  {
    const last_digit = n % 10;
    if (last_digit == 1) return n.toString() + 'st';
    if (last_digit == 2) return n.toString() + 'nd';
    if (last_digit == 3) return n.toString() + 'rd';
  }

  return n.toString() + 'th';
};

const generate_random_big_number = () =>
{
  /*
   * XXX: We generate numbers in the same way that it is done
   *      in The Victor Game, except we use an array instead
   *      of a string to store the number.
   */

  const num_digits = Math.floor(Math.random() * 101);

  if (!num_digits) return [0];

  let result = Array(num_digits);

  for (let i = 0 ; i < num_digits ; i++)
  {
    result[i] = Math.random() * 10;
  }

  return result;
};

const a_is_greater_than_b = (a, b) =>
{
  if (a.length < b.length) return false;
  if (a.length > b.length) return true;
  for (let i = 0 ; i < a.length ; a++)
  {
    if (a[i] < b[i]) return false;
  }
  return a[a.length - 1] > b[a.length - 1];
};

const pct_str = (frac_num) =>
{
  return (Math.floor(100 * (100 * frac_num)) / 100).toString() + '%';
};

let batch_size = 15;
let batch_sizes_too_slow = {};
let batch_sizes_too_fast = {};

const median_value = (obj) =>
{
  const pop_half = Object.values(obj).reduce((a, b) => a + b, 0) / 2;
  let pop_seen = 0;
  let k_prev = undefined;
  for (let k of Object.keys(obj))
  {
    k = parseInt(k);
    const v = obj[k];
    if (pop_seen + 1 >= pop_half)
    {
      if (Math.round(pop_half) == pop_seen + 1) return k;
      return k_prev;
    }
    else if (pop_seen + v >= Math.round(pop_half)) return k;
    pop_seen += v;
    k_prev = k;
  }
  return -1;
};

const calculate_approximate_ideal_batch_size = () =>
{
  const median_too_slow = median_value(batch_sizes_too_slow);
  const median_too_fast = median_value(batch_sizes_too_fast);
  return Math.ceil(median_too_fast + Math.abs((median_too_slow - median_too_fast) / 2));
};

let round_id = 0;
const simulate_round = () =>
{
  const t1 = Date.now();
  const curr_batch_size = Math.min(batch_size, Math.max(0, 10000 - round_id));
  if (curr_batch_size == 0) return;
  for (let i = 0 ; i < curr_batch_size; i++)
  {
    round_id += 1;

    let stop_at_nth_tile_ad  = 1 + Math.floor(Math.random() * 50);
    let stop_at_nth_tile_ct  = undefined;
    let stop_at_nth_tile_osr = undefined;
    let stop_at_nth_tile_gn  = undefined;

    let curr_tile_value = [];
    let tile_values_seen = {'[]': 0};
    let biggest_tile_value_seen = [];
    let tile_num_of_biggest_tile_value_seen = 0;
    for (let j of Array(50).keys())
    {
      const curr_tile_num = j + 1;

      // CT
      if (stop_at_nth_tile_ct === undefined && Math.random() >= 0.5)
      {
        stop_at_nth_tile_ct = curr_tile_num;
      }

      do
      {
        curr_tile_value = generate_random_big_number();
      }
      while (tile_values_seen.hasOwnProperty(curr_tile_value))

      tile_values_seen[curr_tile_value] = curr_tile_num;

      if (a_is_greater_than_b(curr_tile_value, biggest_tile_value_seen))
      {
        biggest_tile_value_seen = curr_tile_value;
        tile_num_of_biggest_tile_value_seen = curr_tile_num;
      }

      // OSR. For the Math.floor(50/e) = 18 first numbers we only look at values. After that we pick.
      if (stop_at_nth_tile_osr === undefined && curr_tile_num > 18 && tile_num_of_biggest_tile_value_seen == curr_tile_num)
      {
        stop_at_nth_tile_osr = curr_tile_num;
      }

      // GN. If we see a tile with approximate probability >= 50% of being
      //     a better choice than any tile that follows it, we pick that tile.
      if (stop_at_nth_tile_gn === undefined && Math.pow(curr_tile_value.length / 100, 50 - curr_tile_num) >= .5)
      {
        stop_at_nth_tile_gn = curr_tile_num;
      }
    }

    // If they didn't make a choice by the 50th tile then the 50th tile is their choice.
    if (stop_at_nth_tile_ct  === undefined) stop_at_nth_tile_ct  = 50;
    if (stop_at_nth_tile_osr === undefined) stop_at_nth_tile_osr = 50;
    if (stop_at_nth_tile_gn  === undefined) stop_at_nth_tile_gn  = 50;

    let outcome_ad = 'lost';
    if (stop_at_nth_tile_ad === tile_num_of_biggest_tile_value_seen)
    {
      outcome_ad = 'won';
      num_wins_ad += 1;
    }

    let outcome_ct = 'lost';
    if (stop_at_nth_tile_ct === tile_num_of_biggest_tile_value_seen)
    {
      outcome_ct = 'won';
      num_wins_ct += 1;
    }

    let outcome_osr = 'lost';
    if (stop_at_nth_tile_osr === tile_num_of_biggest_tile_value_seen)
    {
      outcome_osr = 'won';
      num_wins_osr += 1;
    }

    let outcome_gn = 'lost';
    if (stop_at_nth_tile_gn === tile_num_of_biggest_tile_value_seen)
    {
      outcome_gn = 'won';
      num_wins_gn += 1;
    }

    const round_num_elem  = document.createElement('td');
    round_num_elem.textContent   = round_id.toString();

    const ad_result_elem  = document.createElement('td');
    ad_result_elem.textContent = 'Chose ' + nth_str(stop_at_nth_tile_ad) + ' tile, ' + outcome_ad + '.';
    ad_result_elem.className   = outcome_ad;

    const ct_result_elem  = document.createElement('td');
    ct_result_elem.textContent = 'Chose ' + nth_str(stop_at_nth_tile_ct) + ' tile, ' + outcome_ct + '.';
    ct_result_elem.className   = outcome_ct;

    const osr_result_elem = document.createElement('td');
    osr_result_elem.textContent  = 'Chose ' + nth_str(stop_at_nth_tile_osr)  + ' tile, ' + outcome_osr + '.';
    osr_result_elem.className    = outcome_osr;

    const gn_result_elem  = document.createElement('td');
    gn_result_elem.textContent   = 'Chose ' + nth_str(stop_at_nth_tile_gn)   + ' tile, ' + outcome_gn + '.';
    gn_result_elem.className     = outcome_gn;

    const results_of_round_elem = document.createElement('tr');
    results_of_round_elem.appendChild(round_num_elem);
    results_of_round_elem.appendChild(ad_result_elem);
    results_of_round_elem.appendChild(ct_result_elem);
    results_of_round_elem.appendChild(osr_result_elem);
    results_of_round_elem.appendChild(gn_result_elem);
    results_summary_rounds_elem.prepend(results_of_round_elem);
  }
  win_pct_ad_elem.textContent  = pct_str(num_wins_ad  / round_id);
  win_pct_ct_elem.textContent  = pct_str(num_wins_ct  / round_id);
  win_pct_osr_elem.textContent = pct_str(num_wins_osr / round_id);
  win_pct_gn_elem.textContent  = pct_str(num_wins_gn  / round_id);
  n_rounds_simulated_elem.textContent = round_id;
  const last_duration = Date.now() - t1;

  if (last_duration < approximate_target_frame_time)
  {
    if (batch_sizes_too_fast.hasOwnProperty(batch_size)) batch_sizes_too_fast[batch_size] += last_duration;
    else batch_sizes_too_fast[batch_size] = last_duration;

    if (Object.keys(batch_sizes_too_slow).length) batch_size = calculate_approximate_ideal_batch_size();
    else batch_size = batch_size * 2;
  }
  else if (last_duration > approximate_target_frame_time)
  {
    if (batch_sizes_too_slow.hasOwnProperty(batch_size)) batch_sizes_too_slow[batch_size] += last_duration;
    else batch_sizes_too_slow[batch_size] = last_duration;

    if (Object.keys(batch_sizes_too_fast).length) batch_size = calculate_approximate_ideal_batch_size();
    else batch_size = Math.ceil(batch_size / 1.5);
  }

  window.requestAnimationFrame(simulate_round);
};

let approximate_target_frame_time = 1/60;
let curr_sample_num = 0;
let duration_sum_ms = 0;
let ts_prev = undefined;
const calculate_approximate_target_frame_time = () =>
{
  const ts_curr = Date.now();
  if (curr_sample_num) duration_sum_ms += ts_curr - ts_prev;
  ts_prev = ts_curr;
  if (curr_sample_num < 15)
  {
    curr_sample_num += 1;
    window.requestAnimationFrame(calculate_approximate_target_frame_time);
  }
  else if (curr_sample_num >= 15)
  {
    approximate_target_frame_time = duration_sum_ms / curr_sample_num;
    console.log(approximate_target_frame_time);
    window.requestAnimationFrame(simulate_round);
  }
};
window.onload = calculate_approximate_target_frame_time;
