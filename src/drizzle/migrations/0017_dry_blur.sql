ALTER TABLE "it_categories" DROP CONSTRAINT "it_categories_name_unique";
DROP INDEX "it_sub_category_name_category_unique";
CREATE UNIQUE INDEX "it_category_name_ci_unique" ON "it_categories" USING btree (lower("name"));
CREATE UNIQUE INDEX "it_sub_category_name_category_ci_unique" ON "it_sub_categories" USING btree (lower("name"),"category_id");