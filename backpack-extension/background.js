import OBR, { isImage } from "https://esm.sh/@owlbear-rodeo/sdk@3";

// Уникальный ID расширения (reverse domain notation), чтобы не пересекаться
// с метаданными других расширений
const ID = "rodeo.maxim.backpack";
export const ITEMS_KEY = `${ID}/items`;

OBR.onReady(() => {
  setupOpenBagMenu();
  setupAddToBagMenu();
});

/**
 * Пункт меню "Рюкзак" — показывается при выделении ОДНОГО токена персонажа.
 * Открывает встроенную панель (inventory.html) прямо у токена.
 */
function setupOpenBagMenu() {
  OBR.contextMenu.create({
    id: `${ID}/open-bag`,
    icons: [
      {
        icon: "icons/backpack.svg",
        label: "Рюкзак",
        filter: {
          max: 1,
          every: [{ key: "layer", value: "CHARACTER" }],
        },
      },
    ],
    embed: {
      url: "inventory.html",
      height: 420,
    },
  });
}

/**
 * Пункт меню "Положить в рюкзак" — показывается только ГМу, когда выделены
 * ровно два токена: один персонаж (layer CHARACTER) и один предмет рядом.
 * По клику: предмет удаляется со сцены и его данные добавляются
 * в metadata персонажа под ключом ITEMS_KEY.
 */
function setupAddToBagMenu() {
  OBR.contextMenu.create({
    id: `${ID}/add-to-bag`,
    icons: [
      {
        icon: "icons/add-item.svg",
        label: "Положить в рюкзак",
        filter: {
          min: 2,
          max: 2,
          roles: ["GM"],
          some: [{ key: "layer", value: "CHARACTER" }],
        },
      },
    ],
    async onClick(context) {
      await addSelectedItemToBag(context.items);
    },
  });
}

async function addSelectedItemToBag(items) {
  const character = items.find((item) => item.layer === "CHARACTER");
  const itemToken = items.find((item) => item.id !== character?.id);

  if (!character || !itemToken || !isImage(itemToken)) {
    OBR.notification.show(
      "Нужно выделить токен персонажа и один предмет-картинку рядом",
      "WARNING"
    );
    return;
  }

  const entry = {
    entryId: crypto.randomUUID(),
    name: itemToken.name || "Предмет",
    image: itemToken.image,
    grid: itemToken.grid,
    scale: itemToken.scale,
    layer: itemToken.layer,
  };

  await OBR.scene.items.updateItems([character], (drafts) => {
    for (const draft of drafts) {
      const current = draft.metadata[ITEMS_KEY] || [];
      draft.metadata[ITEMS_KEY] = [...current, entry];
    }
  });

  await OBR.scene.items.deleteItems([itemToken.id]);

  OBR.notification.show(`«${entry.name}» добавлен в рюкзак`, "SUCCESS");
}
