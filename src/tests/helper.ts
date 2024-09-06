import type { Kingdom } from "@core/domain/types/kingdom.js";

export const displayGrid = (kingdom: Kingdom) => {
  for (let i = 0; i < kingdom.length; i++) {
    let row = "";
    for (let j = 0; j < kingdom[i]!.length; j++) {
      row += `${kingdom[i]![j]!.type}(${kingdom[i]![j]!.crowns}) `;
    }
    console.log(row);
  }
};
