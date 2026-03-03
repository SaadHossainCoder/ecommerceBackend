import { Request, Response } from "express";
import * as productService from "../Services/product.service";
import { CONFIG } from "../config/constants";
import { apiStatusCode } from "../lib/apiCode.lib";