import OBR, { buildImage } from "https://esm.sh/@owlbear-rodeo/sdk@3";

const ID = "rodeo.maxim.backpack";
const ITEMS_KEY = `${ID}/items`;

let characterId = null;
let unsubscribe = null;

const app = document.querySelector("#app");

OBR.onReady(init);

async function init() {
  // Панель открылась вместе с контекстным меню — значит выбранный сейчас
  // токен и есть тот персонаж, чей рюкзак нужно показать.
  const selection = await OBR.player.getSelection();
  if (!selection || selection.length === 0) {
    renderMessage("Выделите токен персонажа");
    return;
  }
  characterId = selection[0];

  unsubscribe = OBR.scene.items.onChange(handleItemsChange);

  const items = await OBR.scene.items.getItems([characterId]);
  handleItemsChange(items);
}

function handleItemsChange(items) {
  const character = items.find((item) => item.id === characterId);
  if (!character) {
    renderMessage("Токен не найден на сцене");
    return;
  }
  const list = character.metadata[ITEMS_KEY] || [];
  renderList(list);
}

function renderMessage(text) {
  app.innerHTML = `<p class="empty">${escapeHtml(text)}</p>`;
}

function renderList(list) {
  if (!list.length) {
    renderMessage("Рюкзак пуст");
    return;
  }

  app.innerHTML = "";
  for (const entry of list) {
    const row = document.createElement("div");
    row.className = "item-row";

    const img = document.createElement("img");
    img.src = entry.image?.url ?? "";
    img.alt = "";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = entry.name;

    const button = document.createElement("button");
    button.textContent = "Выбросить";
    button.addEventListener("click", () => dropItem(entry.entryId));

    row.append(img, name, button);
    app.appendChild(row);
  }
}

async function dropItem(entryId) {
  const items = await OBR.scene.items.getItems([characterId]);
  const character = items[0];
  if (!character) return;

  const list = character.metadata[ITEMS_KEY] || [];
  const entry = list.find((item) => item.entryId === entryId);
  if (!entry) return;

  // Убираем предмет из рюкзака
  await OBR.scene.items.updateItems([character], (drafts) => {
    for (const draft of drafts) {
      draft.metadata[ITEMS_KEY] = (draft.metadata[ITEMS_KEY] || []).filter(
        (item) => item.entryId !== entryId
      );
    }
  });

  // Кладём токен предмета на стол рядом с персонажем (с небольшим случайным
  // смещением, чтобы предметы не ложились друг на друга)
  const jitter = () => (Math.random() - 0.5) * 80;
  const dropped = buildImage(entry.image, entry.grid ?? { dpi: 150, offset: { x: 75, y: 75 } })
    .name(entry.name)
    .scale(entry.scale ?? { x: 1, y: 1 })
    .position({
      x: character.position.x + jitter(),
      y: character.position.y + jitter(),
    })
    .layer(entry.layer || "PROP")
    .build();

  await OBR.scene.items.addItems([dropped]);
  OBR.notification.show(`«${entry.name}» лежит на столе`, "DEFAULT");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

window.addEventListener("unload", () => {
  if (unsubscribe) unsubscribe();
});
