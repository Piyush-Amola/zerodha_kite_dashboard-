document.addEventListener("DOMContentLoaded", () => {
  let data = {};
  let currentSymbol = null;
  let chartInstance = null;

  // --- DOM Elements ---
  const userImage = document.getElementById("userImage");
  const userName = document.getElementById("userName");
  const logoutBtn = document.getElementById("logoutBtn");
  const searchInput = document.getElementById("searchInput");
  const watchlistEl = document.getElementById("watchlist");
  const positionsEl = document.getElementById("positions");
  const summaryEl = document.getElementById("summary");
  const orderSymbol = document.getElementById("orderSymbol");
  const orderModal = document.getElementById("orderModal");
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const menuIcon = document.getElementById("menuIcon");

  // ✅ Sidebar toggle (mobile)
  if (menuBtn && sidebar && menuIcon) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("-translate-x-full");

      // Toggle icon between "menu" and "close"
      menuIcon.textContent = sidebar.classList.contains("-translate-x-full")
        ? "menu"
        : "close";
    });
  }

  // --- Load JSON data ---
  fetch("../data/data.json")
    .then((res) => res.json())
    .then((json) => {
      data = json;
      updateDashboard();
    })
    .catch((err) => console.error("Error loading data.json:", err));

  // --- Update Dashboard ---
  function updateDashboard() {
    // ✅ Defensive checks (prevent null errors)
    const niftyEl = document.getElementById("niftyChange");
    const sensexEl = document.getElementById("sensexChange");

    if (niftyEl && sensexEl) {
      niftyEl.textContent = data.market?.nifty || "--";
      sensexEl.textContent = data.market?.sensex || "--";
    }

    // Watchlist
    if (watchlistEl) {
      watchlistEl.innerHTML = "";
      data.watchlist?.forEach((stock) => {
        const li = document.createElement("li");
        li.className =
          "flex justify-between hover:bg-gray-50 rounded-lg px-2 py-1 cursor-pointer";
        li.innerHTML = `<span>${stock.symbol}</span>
                        <span class="${
                          stock.change.includes("+")
                            ? "text-green-600"
                            : "text-red-600"
                        }">${stock.change}</span>`;
        li.addEventListener("click", () => {
          currentSymbol = stock.symbol;
          renderChart(stock.symbol);
        });
        watchlistEl.appendChild(li);
      });
    }

    // Positions
    if (positionsEl) {
      positionsEl.innerHTML = "";
      data.positions?.forEach((pos) => {
        const li = document.createElement("li");
        li.className =
          "flex justify-between items-center bg-gray-50 rounded-lg p-3";
        li.innerHTML = `
          <div>
            <div class="font-semibold">${pos.symbol}</div>
            <div class="text-gray-500 text-xs">Qty: ${pos.qty} | Avg: ₹${
          pos.avg
        }</div>
          </div>
          <div class="${
            pos.pnl.includes("+") ? "text-green-600" : "text-red-600"
          } font-medium">
            ₹${pos.pnl.replace("+", "")}
          </div>`;
        positionsEl.appendChild(li);
      });
    }

    // Summary
    if (summaryEl) {
      summaryEl.innerHTML = `
        <p>Total P&L: <span class="${
          data.summary?.totalPnL.includes("+")
            ? "text-green-600"
            : "text-red-600"
        } font-semibold">₹${data.summary?.totalPnL.replace("+", "")}</span></p>
        <p>Today's Trades: <span class="font-semibold">${
          data.summary?.todayTrades || 0
        }</span></p>`;
    }

    // Fill order modal symbols
    if (orderSymbol) {
      orderSymbol.innerHTML = "";
      data.watchlist?.forEach((stock) => {
        const opt = document.createElement("option");
        opt.value = stock.symbol;
        opt.textContent = stock.symbol;
        orderSymbol.appendChild(opt);
      });
    }

    // Initial Chart
    if (!currentSymbol && data.watchlist?.length > 0)
      currentSymbol = data.watchlist[0].symbol;

    renderChart(currentSymbol);
  }

  // --- Render Chart ---
  function renderChart(symbol) {
    if (!symbol) return;

    const stock = data.watchlist?.find((s) => s.symbol === symbol);
    if (!stock) return;

    const chartTitle = document.getElementById("chartTitle");
    if (chartTitle) chartTitle.textContent = `${symbol} Chart`;

    const canvas = document.getElementById("symbolChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const prices = Array.from({ length: 7 }, () =>
      parseFloat((Math.random() * 100 + 1000).toFixed(2))
    );

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["9:30", "10:30", "11:30", "12:30", "1:30", "2:30", "3:30"],
        datasets: [
          {
            label: symbol,
            data: prices,
            borderColor: stock.change.includes("+") ? "green" : "red",
            fill: false,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: false } },
      },
    });

    // Update prices
    document.getElementById("openPrice").textContent = prices[0];
    document.getElementById("highPrice").textContent = Math.max(...prices);
    document.getElementById("lowPrice").textContent = Math.min(...prices);
  }

  // --- Search Functionality ---
  if (searchInput && watchlistEl) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toUpperCase();
      watchlistEl.innerHTML = "";

      const filtered = data.watchlist?.filter((stock) =>
        stock.symbol.includes(query)
      );

      if (filtered?.length) {
        filtered.forEach((stock) => {
          const li = document.createElement("li");
          li.className =
            "flex justify-between hover:bg-gray-50 rounded-lg px-2 py-1 cursor-pointer";
          li.innerHTML = `<span>${stock.symbol}</span>
                          <span class="${
                            stock.change.includes("+")
                              ? "text-green-600"
                              : "text-red-600"
                          }">${stock.change}</span>`;
          li.addEventListener("click", () => {
            currentSymbol = stock.symbol;
            renderChart(stock.symbol);
            searchInput.value = "";
          });
          watchlistEl.appendChild(li);
        });
      } else {
        const li = document.createElement("li");
        li.className = "text-gray-400 px-2 py-1";
        li.textContent = "No symbols found";
        watchlistEl.appendChild(li);
      }
    });
  }

  // --- Order Modal ---
  const placeOrderBtn = document.getElementById("placeOrderBtn");
  const closeModalBtn = document.getElementById("closeModal");
  const buyBtn = document.getElementById("buyBtn");
  const sellBtn = document.getElementById("sellBtn");

  if (placeOrderBtn && orderModal) {
    placeOrderBtn.addEventListener("click", () => {
      orderModal.style.display = "flex";
    });
  }
  if (closeModalBtn && orderModal) {
    closeModalBtn.addEventListener("click", () => {
      orderModal.style.display = "none";
    });
  }
  if (buyBtn) buyBtn.addEventListener("click", () => placeOrder("Buy"));
  if (sellBtn) sellBtn.addEventListener("click", () => placeOrder("Sell"));

  function placeOrder(type) {
    const sym = document.getElementById("orderSymbol")?.value;
    const qty = document.getElementById("orderQty")?.value;
    const price = document.getElementById("orderPrice")?.value;

    if (!sym || !qty || !price) {
      alert("Please fill all order details!");
      return;
    }

    alert(
      `${type} Order Placed:\nSymbol: ${sym}\nQty: ${qty}\nPrice: ${price}`
    );
    orderModal.style.display = "none";
  }

  // --- User Info & Logout ---
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) window.location.href = "../index.html";

  if (userImage && userName) {
    userImage.addEventListener("click", () => {
      userName.textContent = user.name || "User";
      userName.classList.remove("hidden");
      userName.style.opacity = "1";

      setTimeout(() => {
        userName.style.opacity = "0";
        setTimeout(() => userName.classList.add("hidden"), 300);
      }, 3000);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      window.location.href = "../index.html";
    });
  }

  // --- Live Time Update ---
  function updateTime() {
    const el = document.getElementById("updateTime");
    if (el) el.textContent = new Date().toLocaleTimeString();
  }
  setInterval(updateTime, 1000);
});
