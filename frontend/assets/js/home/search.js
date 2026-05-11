document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("searchInput");

    // Tìm kiếm khi bấm Enter
    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            const keyword = input.value.trim();
            handleSearch(keyword);
        }
    });

    // Tìm kiếm real-time khi gõ (debounce 300ms)
    let debounce;
    input.addEventListener("input", function () {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            const keyword = input.value.trim();
            handleSearch(keyword);
        }, 300);
    });
});


function handleSearch(keyword) {
    if (!keyword) {
        resetHome();
        return;
    }

    keyword = keyword.toLowerCase();

    // lọc sản phẩm
    const result = products.filter(product => {
        const catName = (product.category?.name || product.category || '').toLowerCase();
        return (
            product.name.toLowerCase().includes(keyword) ||
            catName.includes(keyword)
        );
    });


    document.getElementById("flash-section").style.display = "none";
    document.getElementById("best-section").style.display = "none";
    document.getElementById("category-section").style.display = "none";

    document.getElementById("recommend-section").style.display = "block";

    renderSearchUI(result, keyword);

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderSearchUI(list, keyword) {
    const section = document.getElementById("recommend-section");
    const container = document.getElementById("recommend");

    section.querySelector("h2").innerText = `🔍 Kết quả cho "${keyword}"`;

    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = `
            <p style="grid-column: 1/-1; text-align:center;">
                Không tìm thấy sản phẩm
            </p>
        `;
        return;
    }

    container.innerHTML = list.map(p => renderCard(p)).join("");
}

function resetHome() {
    document.getElementById("searchInput").value = "";

    document.getElementById("recommend-section").querySelector("h2").innerText = "⭐ DÀNH CHO BẠN";

    document.getElementById("flash-section").style.display = "block";
    document.getElementById("best-section").style.display = "block";
    document.getElementById("recommend-section").style.display = "block";

    if (typeof initRender === "function") {
        initRender();
    }
}

window.addEventListener("load", () => {
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get("search");

    if (keyword) {
        const input = document.getElementById("searchInput");
        if (input) {
            input.value = keyword;
        }

        handleSearch(keyword);
    }
});