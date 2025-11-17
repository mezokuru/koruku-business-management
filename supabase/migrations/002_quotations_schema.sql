-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Create quotation_items table for line items
CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_project_id ON quotations(project_id);
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(date DESC);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_quotations_updated_at();

-- Create trigger to auto-calculate quotation totals
CREATE OR REPLACE FUNCTION calculate_quotation_totals()
RETURNS TRIGGER AS $$
DECLARE
  items_total DECIMAL(10, 2);
  discount DECIMAL(10, 2);
BEGIN
  -- Calculate sum of all items
  SELECT COALESCE(SUM(amount), 0) INTO items_total
  FROM quotation_items
  WHERE quotation_id = NEW.id;
  
  -- Update subtotal
  NEW.subtotal = items_total;
  
  -- Calculate discount
  IF NEW.discount_percentage > 0 THEN
    discount = (items_total * NEW.discount_percentage) / 100;
    NEW.discount_amount = discount;
  ELSE
    NEW.discount_amount = 0;
  END IF;
  
  -- Calculate total
  NEW.total = items_total - NEW.discount_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotations_calculate_totals
  BEFORE INSERT OR UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_quotation_totals();

-- Create trigger to recalculate quotation totals when items change
CREATE OR REPLACE FUNCTION recalculate_quotation_on_item_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the quotation to trigger total recalculation
  UPDATE quotations
  SET updated_at = NOW()
  WHERE id = COALESCE(NEW.quotation_id, OLD.quotation_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotation_items_change
  AFTER INSERT OR UPDATE OR DELETE ON quotation_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_quotation_on_item_change();

-- Create trigger to auto-expire quotations
CREATE OR REPLACE FUNCTION auto_expire_quotations()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-expire quotations that are past their valid_until date
  IF NEW.status IN ('draft', 'sent') AND NEW.valid_until < CURRENT_DATE THEN
    NEW.status = 'expired';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotations_auto_expire
  BEFORE UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION auto_expire_quotations();

-- Enable Row Level Security
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quotations
CREATE POLICY "Users can view their own quotations"
  ON quotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotations"
  ON quotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotations"
  ON quotations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotations"
  ON quotations FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for quotation_items
CREATE POLICY "Users can view items of their quotations"
  ON quotation_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_items.quotation_id
      AND quotations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items to their quotations"
  ON quotation_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_items.quotation_id
      AND quotations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items of their quotations"
  ON quotation_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_items.quotation_id
      AND quotations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items of their quotations"
  ON quotation_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_items.quotation_id
      AND quotations.user_id = auth.uid()
    )
  );

-- Create view for quotations with client and project info
CREATE OR REPLACE VIEW quotations_with_relations AS
SELECT 
  q.*,
  c.business as client_business,
  c.email as client_email,
  c.phone as client_phone,
  p.name as project_name,
  (
    SELECT json_agg(
      json_build_object(
        'id', qi.id,
        'description', qi.description,
        'quantity', qi.quantity,
        'unit_price', qi.unit_price,
        'amount', qi.amount,
        'sort_order', qi.sort_order
      ) ORDER BY qi.sort_order, qi.created_at
    )
    FROM quotation_items qi
    WHERE qi.quotation_id = q.id
  ) as items
FROM quotations q
LEFT JOIN clients c ON q.client_id = c.id
LEFT JOIN projects p ON q.project_id = p.id;

-- Grant permissions
GRANT ALL ON quotations TO authenticated;
GRANT ALL ON quotation_items TO authenticated;
GRANT SELECT ON quotations_with_relations TO authenticated;

-- Add comment
COMMENT ON TABLE quotations IS 'Stores quotations/estimates for clients';
COMMENT ON TABLE quotation_items IS 'Stores line items for quotations';
COMMENT ON VIEW quotations_with_relations IS 'View combining quotations with client and project information';
