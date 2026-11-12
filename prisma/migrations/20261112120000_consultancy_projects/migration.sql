-- CreateTable
CREATE TABLE "ConsultancyProject" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "client" TEXT,
    "year" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultancyProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsultancyProject_category_order_idx" ON "ConsultancyProject"("category", "order");
