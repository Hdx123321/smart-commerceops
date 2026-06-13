package db.migration;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

/**
 * Widen image_url from VARCHAR(1000) to TEXT (needed for JSON arrays of
 * multiple image URLs) and convert existing single-URL seed data.
 * <p>
 * Uses a try/catch on the ALTER TABLE because H2 and MySQL use different
 * syntax for changing a column type. The migration also wraps any
 * existing plain-string values into JSON arrays so the new
 * {@code List<String> imageUrls} parsing works without errors.
 */
public class V3__WidenImageUrl extends BaseJavaMigration {

    @Override
    public void migrate(Context context) throws Exception {
        Connection c = context.getConnection();

        // Widen the column — MySQL then H2 fallback
        try {
            c.createStatement().execute("ALTER TABLE products MODIFY image_url TEXT");
        } catch (Exception e) {
            c.createStatement().execute("ALTER TABLE products ALTER COLUMN image_url SET DATA TYPE TEXT");
        }

        // Wrap existing plain URLs into single-element JSON arrays
        try (PreparedStatement ps = c.prepareStatement(
                "SELECT id, image_url FROM products WHERE image_url IS NOT NULL AND image_url NOT LIKE '[%'");
             ResultSet rs = ps.executeQuery();
             PreparedStatement up = c.prepareStatement(
                     "UPDATE products SET image_url = ? WHERE id = ?")) {
            while (rs.next()) {
                String old = rs.getString("image_url");
                if (old != null && !old.isBlank()) {
                    up.setString(1, "[\"" + old + "\"]");
                    up.setLong(2, rs.getLong("id"));
                    up.executeUpdate();
                }
            }
        }
    }
}
