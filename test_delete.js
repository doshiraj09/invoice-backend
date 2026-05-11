require('dotenv').config();
const { Invoice, InvoiceItem, Product, sequelize } = require('./models');

async function testDelete() {
    const t = await sequelize.transaction();
    try {
        const invoice = await Invoice.findByPk(10, { transaction: t });
        if (!invoice) throw new Error('Invoice not found');

        const items = await InvoiceItem.findAll({ where: { invoice_id: invoice.id }, transaction: t });
        for (const item of items) {
            const product = await Product.findByPk(item.product_id, { transaction: t });
            if (product) {
                await product.update({
                    current_stock: (product.current_stock || 0) + parseFloat(item.quantity || 0)
                }, { transaction: t });
            }
            await item.destroy({ transaction: t });
        }

        await invoice.destroy({ transaction: t });
        
        await t.commit();
        console.log('Success');
    } catch (error) {
        await t.rollback();
        console.log('Error:', error);
    }
}
testDelete();
