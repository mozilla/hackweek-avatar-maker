import React, { useRef, useContext } from "react";
import { ThumbnailButton } from "./ThumbnailButton";
import { TipContext } from "./TipContext";

function AvatarPart({
  part,
  tip,
  isSelected,
  categoryName,
  onSelectAvatarPart,
  onHoverAvatarPart,
  onUnhoverAvatarPart,
}) {
  const buttonRef = useRef(null);

  return (
    <ThumbnailButton
      ref={buttonRef}
      tip={tip}
      image={part.value}
      selected={isSelected}
      onClick={() => {
        onSelectAvatarPart({ categoryName, part });
      }}
      onMouseOver={() => {
        const [rect] = buttonRef.current.getClientRects();
        onHoverAvatarPart({ categoryName, part, tip, rect });
      }}
      onMouseOut={() => {
        onUnhoverAvatarPart();
      }}
    />
  );
}

function match({ description, part }) {
  if (!part.description) return false;
  for (const param of Object.keys(description)) {
    if (part.description[param] !== description[param]) {
      return false;
    }
  }
  return true;
}

function capitalize(str) {
  return str[0].toUpperCase() + str.substring(1);
}

function parseSubCategories({ category, currentSelection }) {
  const optionNames = Object.keys(category.description);

  return optionNames.map((optionName) => {
    if (currentSelection.value === null && !category.description[optionName].isPrimaryOption) {
      return { optionName, parts: [{part:{value: null, displayName: "None"}, tip: "None"}] }
    }
    const options = category.description[optionName].options;
    const parts = options
      .map((option) => {
        if (option === null) {
          const part = category.parts.find((part) => part.value === null);
          return { part, tip: "None" };
        }

        const description = Object.assign({}, currentSelection.description);
        description[optionName] = option;

        let part = category.parts.find((part) => {
          return match({ description, part });
        });

        if (!part && category.description[optionName].isPrimaryOption) {
          part = category.parts.find((part) => part.value !== null && part.description[optionName] === option);
        }

        const tip = option
          .split("-")
          .map((p) => capitalize(p))
          .join(" ");

        return { part, tip };
      })
      .filter(({ part }) => !!part);
    return { optionName, parts };
  });
}

export function SubCategory({ name, parts }) {
  return (
    <div key={name}>
      <h2>{name}</h2>
      {parts}
    </div>
  );
}

export function CategoryContainer({
  category,
  categoryName,
  currentSelection,
  onSelectAvatarPart,
  onHoverAvatarPart,
  onUnhoverAvatarPart,
}) {
  if (category.description) {
    const subcategoryInfo = parseSubCategories({ category, currentSelection });
    return subcategoryInfo.map(({ optionName, parts }) => {
      return (
        <SubCategory
          key={optionName}
          name={optionName}
          parts={parts.map(({ part, tip }) => (
            <AvatarPart
              {...{
                key: part.value,
                part,
                tip,
                isSelected: part.value === currentSelection.value,
                categoryName,
                onSelectAvatarPart,
                onHoverAvatarPart,
                onUnhoverAvatarPart,
              }}
            />
          ))}
        />
      );
    });
  } else {
    return category.parts.map((part) => {
      const tip = part.displayName;
      return (
        <AvatarPart
          {...{
            key: part.value,
            part,
            tip,
            isSelected: part.value === currentSelection.value,
            categoryName,
            onSelectAvatarPart,
            onHoverAvatarPart,
            onUnhoverAvatarPart,
          }}
        />
      );
    });
  }
}
