from rollinggo_cli.output import print_flight_table


def test_print_flight_table_renders_current_response_shape(capsys):
    print_flight_table(
        {
            "flightInformationList": [
                {
                    "totalAdultPrice": 625,
                    "currency": "CNY",
                    "validatingCarrier": "CA",
                    "fromSegments": [
                        {
                            "flightNumber": "CA4598",
                            "depTime": "2026-05-10T20:00:00",
                            "arrTime": "2026-05-10T23:00:00",
                            "depAirport": "HGH",
                            "arrAirport": "CTU",
                        }
                    ],
                }
            ]
        }
    )

    output = capsys.readouterr().out
    assert "CA4598" in output
    assert "CA" in output
    assert "HGH" in output
    assert "CTU" in output
    assert "2026-05-10" in output
    assert "20:00" in output
    assert "625" in output
    assert "CNY" in output
