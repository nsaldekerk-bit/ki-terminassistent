-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('consultation', 'booking');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('new', 'contacted', 'scheduled', 'closed');

-- CreateTable
CREATE TABLE "booking_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "service_id" TEXT,
    "type" "RequestType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'new',
    "reference" TEXT NOT NULL,
    "service_label" TEXT,
    "area_text" TEXT,
    "situation" TEXT,
    "address" TEXT,
    "preferred_date" TIMESTAMP(3),
    "preferred_time" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_photos" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "data_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "booking_requests_reference_key" ON "booking_requests"("reference");

-- CreateIndex
CREATE INDEX "booking_requests_tenant_id_idx" ON "booking_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "booking_requests_tenant_id_status_idx" ON "booking_requests"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "request_photos_request_id_idx" ON "request_photos"("request_id");

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_photos" ADD CONSTRAINT "request_photos_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "booking_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
