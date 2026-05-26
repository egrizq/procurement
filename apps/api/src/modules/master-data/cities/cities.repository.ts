import db from "../../../config/drizzle.ts";
import { mstCities } from "../../../db/schema/index.ts";

class MstCityRepository {
	async getMasterCities() {
		const cities = await db.select().from(mstCities);
		const flattenedCities = cities.map((city) => ({
			id: city.id,
			cityName: city.cityName,
		}));
		return { flattenedCities };
	}
}

export default MstCityRepository;
