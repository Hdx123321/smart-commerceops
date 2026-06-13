package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import java.sql.Connection;
import java.sql.PreparedStatement;

/**
 * V4: Clear seed-data image URLs that point to non-existent files.
 * <p>
 * V1 inserted {@code /images/products/coke.png} and
 * {@code /images/products/fanta.png} which were never actual files.
 * V3 wrapped them into JSON arrays so the frontend renders antd Image
 * components that 404 forever and leave skeleton placeholders stuck.
 * Setting them to NULL lets the frontend skip the missing images.
 */
public class V4__ClearMissingSeedImages extends BaseJavaMigration {

    @Override
    public void migrate(Context context) throws Exception {
        Connection c = context.getConnection();
        try (PreparedStatement ps = c.prepareStatement(
                "UPDATE products SET image_url = NULL WHERE image_url IN ('[\"/images/products/coke.png\"]', '[\"/images/products/fanta.png\"]')")) {
            int updated = ps.executeUpdate();
            System.out.println("V4: cleared " + updated + " broken seed image URLs");
        }
    }
}
