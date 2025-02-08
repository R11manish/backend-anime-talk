import { Router } from "express";
import { asyncHandler } from "../middleware/async.middleware";
import { CharacterService } from "../service/character.service";

const router: Router = Router();
const charService = new CharacterService();

// TODO: create a admin middleware for this 

// router.post(
//   "/create",
//   asyncHandler(async (req, res) => {
//     const charDetail = req.body;
//     await charService.createCharacter(charDetail);
//     res.status(201).json({ message: "Character created successfully" });
//   })
// );

router.get(
  "/all",
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const lastKey = req.query.lastKey
      ? JSON.parse(req.query.lastKey as string)
      : undefined;

    const characters = await charService.getAllCharacters(limit, lastKey);
    res.status(200).json({
      data: characters.items,
      lastKey: characters.lastEvaluatedKey,
      count: characters.items.length,
    });
  })
);

router.get(
  "/featured",
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const lastKey = req.query.lastKey
      ? JSON.parse(req.query.lastKey as string)
      : undefined;

    const characters = await charService.getFeatureCharacter(limit, lastKey);
    res.status(200).json({
      data: characters.items,
      lastKey: characters.lastEvaluatedKey,
      count: characters.items.length,
    });
  })
);

router.get(
  "/:name",
  asyncHandler(async (req, res) => {
    const { name } = req.params;
    const character = await charService.getCharacterByName(name);
    res.status(200).json(character);
  })
);

export default router;
