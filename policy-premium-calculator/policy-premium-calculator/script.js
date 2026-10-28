/* ---------- Rating tables (illustrative values) ---------- */
const BASE_MONTHLY = { bronze: 250, silver: 340, gold: 450, platinum: 580 }; // age-21 adult base rate
const REGION_FACTOR = { metro: 1.15, urban: 1.0, rural: 0.9 };
const TOBACCO_SURCHARGE = 0.5;   // +50% (ACA cap is 1.5x)
const WELLNESS_DISCOUNT = 0.05;  // -5%
const CHILD_FACTOR = 0.65;       // each child costs 65% of an adult base (max 3 children rated)
const MAX_RATED_CHILDREN = 3;
const SPOUSE_FACTOR = 1.0;
const ADMIN_FEE = 12;            // flat monthly fee
const TAX_RATE = 0.05;           // premium tax

/* Age band factor, loosely following a 3:1 age curve */
function ageFactor(age) {
  if (age <= 20) return 0.635;
  if (age <= 24) return 1.0;
  if (age <= 29) return 1.1;
  if (age <= 34) return 1.2;
  if (age <= 39) return 1.3;
  if (age <= 44) return 1.45;
  if (age <= 49) return 1.7;
  if (age <= 54) return 2.0;
  if (age <= 59) return 2.4;
  if (age <= 64) return 2.8;
  return 3.0;
}

/* Core calculation: returns an itemised breakdown */
function calculatePremium(input) {
  const { age, plan, coverage, kids, region, tobacco, wellness } = input;
  const base = BASE_MONTHLY[plan];
  const ageAdj = base * ageFactor(age);

  // Household multiplier
  let household = 1;
  if (coverage === "couple" || coverage === "family") household += SPOUSE_FACTOR;
  if (coverage === "family") household += Math.min(kids, MAX_RATED_CHILDREN) * CHILD_FACTOR;

  const subtotal = ageAdj * household;
  const regionAdj = subtotal * (REGION_FACTOR[region] - 1);
  const tobaccoAdj = tobacco ? (subtotal + regionAdj) * TOBACCO_SURCHARGE : 0;
  const preDiscount = subtotal + regionAdj + tobaccoAdj;
  const wellnessAdj = wellness ? -preDiscount * WELLNESS_DISCOUNT : 0;
  const net = preDiscount + wellnessAdj;
  const tax = (net + ADMIN_FEE) * TAX_RATE;
  const monthly = net + ADMIN_FEE + tax;

  return {
    lines: [
      ["Base rate (" + plan + ")", base],
      ["Age adjustment (x" + ageFactor(age) + ")", ageAdj - base],
      ["Household size (x" + household.toFixed(2) + ")", subtotal - ageAdj],
      ["Region adjustment", regionAdj],
      ["Tobacco surcharge", tobaccoAdj],
      ["Wellness discount", wellnessAdj],
      ["Admin fee", ADMIN_FEE],
      ["Premium tax (" + TAX_RATE * 100 + "%)", tax],
    ],
    monthly,
    annual: monthly * 12,
  };
}

/* ---------- UI ---------- */
const $ = id => document.getElementById(id);
const money = n => (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function readInput() {
  return {
    age: parseInt($("age").value, 10),
    plan: $("plan").value,
    coverage: $("coverage").value,
    kids: parseInt($("kids").value, 10) || 0,
    region: $("region").value,
    tobacco: $("tobacco").checked,
    wellness: $("wellness").checked,
  };
}

function validate(i) {
  if (Number.isNaN(i.age) || i.age < 0 || i.age > 100) return "Enter an age between 0 and 100.";
  if (i.kids < 0 || i.kids > 10) return "Children covered must be between 0 and 10.";
  if (i.coverage !== "family" && i.kids > 0) return "Set coverage type to Family to include children.";
  if (i.age < 18 && i.coverage !== "individual") return "A primary member under 18 can only have Individual coverage.";
  return "";
}

function render() {
  const input = readInput();
  const problem = validate(input);
  $("err").textContent = problem;
  if (problem) return;
  const r = calculatePremium(input);
  const rows = r.lines.filter(l => Math.abs(l[1]) > 0.004).map(l =>
    "<tr><td>" + l[0] + "</td><td class='" + (l[1] < 0 ? "neg" : "") + "'>" + money(l[1]) + "</td></tr>").join("");
  $("result").innerHTML =
    "<div class='hint'>Estimated monthly premium</div>" +
    "<div class='total'>" + money(r.monthly) + " <small>/ month</small></div>" +
    "<div class='hint'>" + money(r.annual) + " per year</div>" +
    "<table><tbody>" + rows +
    "<tr class='sum'><td>Monthly total</td><td>" + money(r.monthly) + "</td></tr></tbody></table>";
}

$("calc").addEventListener("click", render);
["age","plan","coverage","kids","region","tobacco","wellness"].forEach(id => $(id).addEventListener("change", render));
render();
