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
const win_pct_rand_elem = document.getElementById('win-pct-rand');
const win_pct_osr_elem = document.getElementById('win-pct-osr');
const win_pct_gn_elem = document.getElementById('win-pct-gn');

for (let i of Array(1000).keys())
{
  const round_id = i + 1;

  const round_num_elem = document.createElement('td');
  const rand_result_elem = document.createElement('td');
  const osr_result_elem = document.createElement('td');
  const gn_result_elem = document.createElement('td');

  round_num_elem.textContent = round_id.toString();
  rand_result_elem.textContent = 'Unknown';
  osr_result_elem.textContent = 'Unknown';
  gn_result_elem.textContent = 'Unknown';

  const results_of_round_elem = document.createElement('tr');
  results_of_round_elem.appendChild(round_num_elem);
  results_of_round_elem.appendChild(rand_result_elem);
  results_of_round_elem.appendChild(osr_result_elem);
  results_of_round_elem.appendChild(gn_result_elem);
  results_summary_rounds_elem.prepend(results_of_round_elem);

  win_pct_rand_elem.textContent = 'Unknown';
  win_pct_osr_elem.textContent = 'Unknown';
  win_pct_gn_elem.textContent = 'Unknown';
}