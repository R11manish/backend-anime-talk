import { Router } from "express";
import { asyncHandler } from "../middleware/async.middleware";
import { CharacterService } from "../service/character.service";
import {
  apiKeyMiddleware,
  adminMiddleware,
} from "../middleware/auth.middleware";

const router: Router = Router();
const charService = new CharacterService();

router.post(
  "/create",
  apiKeyMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const charDetail = req.body;
    await charService.createCharacter(charDetail);
    res.status(201).json({ message: "Character created successfully" });
  })
);

router.get(
  "/all",
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const nextPageToken = req.query.nextPageToken as string | undefined;

    const characters = await charService.getAllCharacters(limit, nextPageToken);
    res.status(200).json({
      data: characters.items,
      nextPageToken: characters.nextPageToken,
      count: characters.count,
    });
  })
);

router.get(
  "/featured",
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const nextPageToken = req.query.nextPageToken as string | undefined;

    const characters = await charService.getFeatureCharacter(
      limit,
      nextPageToken
    );
    res.status(200).json({
      data: characters.items,
      nextPageToken: characters.nextPageToken,
      count: characters.count,
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
