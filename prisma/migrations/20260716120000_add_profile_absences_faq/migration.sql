-- AlterTable
ALTER TABLE "booking_requests" ADD COLUMN     "consent_at" TIMESTAMP(3),
ADD COLUMN     "is_emergency" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "reminder_sent_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "buffer_minutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "emergency_note" TEXT,
ADD COLUMN     "emergency_phone" TEXT,
ADD COLUMN     "service_area_postcodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "absences" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "absences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "keywords" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faq_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "absences_tenant_id_idx" ON "absences"("tenant_id");

-- CreateIndex
CREATE INDEX "absences_tenant_id_start_date_end_date_idx" ON "absences"("tenant_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "faq_entries_tenant_id_idx" ON "faq_entries"("tenant_id");

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_entries" ADD CONSTRAINT "faq_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

