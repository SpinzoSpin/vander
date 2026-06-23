-- AddForeignKey
ALTER TABLE "treasury" ADD CONSTRAINT "treasury_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "networks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
